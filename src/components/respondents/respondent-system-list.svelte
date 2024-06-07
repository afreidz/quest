<script lang="ts">
  import CardHeader from "@/components/app/card-header.svelte";
  import type { RespondentFromAll } from "@/actions/respondents";

  type Props = {
    respondent: RespondentFromAll;
  };

  function getRevisionsBySystemId(id: string) {
    return respondent.revisions.filter((r) => r.systemId === id);
  }

  function hasCompletedSurvey(sid: string | null) {
    const survey = respondent.surveys.find((s) => s.id === sid);
    if (!sid || !survey) return false;

    const responses = respondent.responses.filter(
      (r) => r.surveyId === survey.id
    );

    return responses.length === survey._count.questions;
  }

  let { respondent }: Props = $props();
</script>

<CardHeader border={false}>Systems and Revisions</CardHeader>
<div class="overflow-x-auto h-96 rounded">
  <table class="table table-pin-rows">
    {#each respondent.systems as system}
      <thead>
        <tr class="bg-base-100/20 border-neutral-300">
          <td class="p-4" colspan="2">{system.client.name} | {system.title}</td>
        </tr>
      </thead>
      <tbody>
        {#each getRevisionsBySystemId(system.id) as revision}
          <tr class="bg-neutral border-neutral-300">
            <td class="text-lg py-4">{revision.title}</td>
            <td class="text-right">
              <aside class="mr-4 inline-flex gap-4">
                {#if hasCompletedSurvey(revision.surveyId)}
                  <span class="badge badge-primary">completed survey</span>
                {/if}
                {#if hasCompletedSurvey(revision.checklistId)}
                  <span class="badge badge-secondary">completed checklist</span>
                {/if}
              </aside>
              <ul class="join">
                <li class="contents">
                  <a
                    data-tip="Go to survey"
                    href={`/public/survey/${respondent.id}/revision/${revision.id}`}
                    class="join-item btn btn-secondary tooltip tooltip-left tooltip-primary !inline-flex"
                  >
                    <iconify-icon icon="ri:survey-line"></iconify-icon>
                  </a>
                </li>
                <li class="contents">
                  <a
                    href={`/public/checklist/${respondent.id}/revision/${revision.id}`}
                    data-tip="Go to checklist"
                    class="join-item btn btn-secondary tooltip tooltip-left tooltip-primary !inline-flex"
                  >
                    <iconify-icon icon="ic:baseline-checklist"></iconify-icon>
                  </a>
                </li>
                <li class="contents">
                  <a
                    href={`/moderate-session/${respondent.id}/revision/${revision.id}`}
                    data-tip="Start a session"
                    class="join-item btn btn-secondary tooltip tooltip-left tooltip-primary !inline-flex"
                  >
                    <iconify-icon icon="tabler:live-photo"></iconify-icon>
                  </a>
                </li>
              </ul>
            </td>
          </tr>
        {/each}
      </tbody>
    {/each}
  </table>
</div>
